import React, { Component } from "react";
import { View, TouchableOpacity, Modal } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { connect } from "react-redux";

import {
  clearRemoteSurveys,
  fetchRemoteSurvey,
  listRemoteSurveys
} from "../../actions";
import { StatusBar, Text } from "../../components";
import RemoteSurveyList from "./RemoteSurveyList";
import { selectRemoteSurveys } from "../../selectors";
import { baseStyles } from "../../styles";

class SurveyModal extends Component {
  componentWillMount() {
    this.props.clearRemoteSurveys();
    this.props.listRemoteSurveys();
  }

  render() {
    const { close, fetchRemoteSurvey, remoteSurveys } = this.props;

    return (
      <Modal animationType="slide" transparent visible onRequestClose={close}>
        <View style={[baseStyles.wrapperContentMd, baseStyles.modal]}>
          <StatusBar />

          <View style={[baseStyles.wrappedItems]}>
            <Text style={[baseStyles.h2, baseStyles.wrappedItemsLeft]}>
              Add Surveys
            </Text>
            <TouchableOpacity onPress={close}>
              <Icon name="clear" style={[[baseStyles.clearIcon]]} />
            </TouchableOpacity>
          </View>
          <RemoteSurveyList fetch={fetchRemoteSurvey} surveys={remoteSurveys} />
          <TouchableOpacity onPress={close} style={[baseStyles.buttonBottom]}>
            <Text style={[baseStyles.textWhite]}>
              {"Done".toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  remoteSurveys: selectRemoteSurveys(state)
});

export default connect(mapStateToProps, {
  clearRemoteSurveys,
  fetchRemoteSurvey,
  listRemoteSurveys
})(SurveyModal);